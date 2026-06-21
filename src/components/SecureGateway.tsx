import React, { useState, useEffect } from "react";
import { auth, db } from "../lib/firebase";
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { Lock, Mail, ShieldAlert, Key, X, Activity } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SecureGatewayProps {
  onAccessGranted: () => void;
  onClose: () => void;
}

export default function SecureGateway({ onAccessGranted, onClose }: SecureGatewayProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAuthResult = async (user: any) => {
    try {
      let userDoc;
      try {
        userDoc = await getDoc(doc(db, "users", user.uid));
      } catch (dbErr: any) {
        if (dbErr.message && (dbErr.message.includes("offline") || dbErr.message.includes("network") || dbErr.message.includes("failed-precondition") || dbErr.message.includes("Failed to get document"))) {
          console.warn("Firestore offline query fallback:", dbErr);
          const offlineBypassEmails = ["imashaisuri49@gmail.com", "Chanukaofficial31@gmail.com"];
          if (offlineBypassEmails.includes(user.email)) {
            console.log("Local offline bypass granted for admin:", user.email);
            onAccessGranted();
            return;
          } else {
            throw new Error("Local Database is offline. Bypass is only permitted for primary developer identities. (Use passcode '08' for instant master bypass)");
          }
        }
        throw dbErr;
      }
      
      if (!userDoc.exists()) {
        // Create user record with default 'developer' role
        await setDoc(doc(db, "users", user.uid), {
          uid: user.uid,
          name: user.displayName || email || "Unknown",
          email: user.email,
          role: "developer",
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
          active: true
        });
        
        // Log the login activity
        await setDoc(doc(db, "activity_logs", Date.now().toString()), {
          userId: user.uid,
          action: "developer_center_login_new_account",
          timestamp: serverTimestamp(),
        });
        
        onAccessGranted();
        return;
      }
      
      const userData = userDoc.data();
      
      // Update last login
      await setDoc(doc(db, "users", user.uid), {
        lastLogin: serverTimestamp()
      }, { merge: true });

      const allowedRoles = ["admin", "developer", "super_admin"];
      if (allowedRoles.includes(userData.role)) {
        // Log the login activity
        await setDoc(doc(db, "activity_logs", Date.now().toString()), {
          userId: user.uid,
          action: "developer_center_login",
          timestamp: serverTimestamp(),
        });
        
        onAccessGranted();
      } else {
        await signOut(auth);
        setErrorMsg(`Access Denied. Current Role: ${userData.role}`);
      }
    } catch (err: any) {
      console.warn("Authentication result warning:", err);
      setErrorMsg(err.message || "Authentication Gateway Error");
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // Master Emergency Passcode Bypass Check ("08")
    if (password === "08" || email === "08") {
      onAccessGranted();
      return;
    }

    if (!auth) {
      setErrorMsg("Firebase auth not initialized");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await handleAuthResult(cred.user);
    } catch (err: any) {
      if (err.message && (err.message.includes("offline") || err.message.includes("network-request-failed") || err.message.includes("Failed to get document"))) {
        const offlineEmails = ["imashaisuri49@gmail.com", "Chanukaofficial31@gmail.com"];
        if (offlineEmails.includes(email)) {
          onAccessGranted();
          return;
        }
        setErrorMsg("Network offline. Enter Master Passcode '08' to access control center.");
      } else {
        setErrorMsg(err.message || "Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!auth) {
      setErrorMsg("Firebase auth not initialized");
      return;
    }
    setLoading(true);
    setErrorMsg("");
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleAuthResult(result.user);
    } catch (err: any) {
      if (err.message && (err.message.includes("offline") || err.message.includes("network-request-failed") || err.message.includes("Failed to get document"))) {
        setErrorMsg("Network offline. Please use Master Passcode '08' to enter.");
      } else {
        setErrorMsg(err.message || "Authentication cancelled");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-sm bg-[#0a0a0f] border border-red-500/30 rounded-2xl p-6 shadow-[0_0_40px_rgba(239,68,68,0.15)] relative overflow-hidden"
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500/20 via-red-500 to-red-500/20" />
        
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition">
           <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center text-center mt-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-red-950/50 border border-red-500/30 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-widest uppercase">Developer Gateway</h2>
          <p className="text-xs text-red-400/80 font-mono mt-2">RESTRICTED ACCESS AREA</p>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-950/40 border border-red-500/40 text-red-400 text-xs p-3 rounded flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <p className="font-mono">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-[#131422] border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                placeholder="Developer UID Route"
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Key className="w-4 h-4 text-slate-500" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-[#131422] border border-white/10 rounded-lg pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-red-500/50 transition-colors"
                placeholder="Access Hash"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-red-600/10 hover:bg-red-600/20 border border-red-500/50 text-red-400 font-bold rounded-lg transition-colors flex items-center justify-center gap-2 tracking-widest text-sm disabled:opacity-50"
          >
            {loading ? <Activity className="w-4 h-4 animate-spin" /> : "INITIATE SEQUENCE"}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-4 before:flex-1 before:h-px before:bg-white/10 after:flex-1 after:h-px after:bg-white/10">
          <span className="text-[10px] text-slate-600 uppercase font-mono tracking-widest">or</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          disabled={loading}
          className="mt-6 w-full py-2.5 bg-white text-black font-bold rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2 text-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          G-OAUTH ENCRYPTED
        </button>
      </motion.div>
    </div>
  );
}
