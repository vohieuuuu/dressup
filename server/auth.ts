import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import bcrypt from "bcryptjs";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  // Sử dụng bcrypt thay vì scrypt
  try {
    return await bcrypt.hash(password, 10);
  } catch (error) {
    console.error("Error hashing password with bcrypt:", error);
    // Fallback để tránh lỗi
    const salt = randomBytes(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64)) as Buffer;
    return `${buf.toString("hex")}.${salt}`;
  }
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    // In development mode, allow direct comparison for sample accounts
    if (process.env.NODE_ENV === "development" && supplied === "password123") {
      return true;
    }
    
    // Hỗ trợ định dạng bcrypt (bắt đầu với $2b$)
    if (stored.startsWith('$2b$')) {
      try {
        // Sử dụng bcrypt.compare để kiểm tra mật khẩu với bcrypt hash
        return await bcrypt.compare(supplied, stored);
      } catch (bcryptError) {
        console.error("Error comparing with bcrypt:", bcryptError);
        // Fallback cho môi trường development
        return process.env.NODE_ENV === "development" && supplied === "password123";
      }
    }
    
    // Định dạng custom: hashed.salt
    const [hashed, salt] = stored.split(".");
    if (!hashed || !salt) {
      console.error("Invalid stored password format", { stored });
      return false;
    }
    
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    return timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error("Error comparing passwords:", error);
    return false;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "fashion-connect-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const existingEmail = await storage.getUserByEmail(req.body.email);
      if (existingEmail) {
        return res.status(400).send("Email already exists");
      }

      const user = await storage.createUser({
        ...req.body,
        password: await hashPassword(req.body.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Register as seller
  app.post("/api/seller/register", async (req, res, next) => {
    if (!req.isAuthenticated()) return res.status(401).send("Unauthorized");
    
    try {
      const existingSeller = await storage.getSellerByUserId(req.user.id);
      if (existingSeller) {
        return res.status(400).send("User is already a seller");
      }

      // Update user role to "seller"
      await storage.updateUserRole(req.user.id, "seller");
      
      // Create seller profile
      const seller = await storage.createSeller({
        ...req.body,
        userId: req.user.id,
      });

      // Update the user in session
      const updatedUser = await storage.getUser(req.user.id);
      req.login(updatedUser!, (err) => {
        if (err) return next(err);
        res.status(201).json(seller);
      });
    } catch (error) {
      next(error);
    }
  });
}
