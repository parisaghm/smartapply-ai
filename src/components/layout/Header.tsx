
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { LogIn, LogOut, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";


// Local fake auth helper functions
type StoredUser = { email: string; password: string };

const getStoredUsers = (): StoredUser[] => {
  try {
    return JSON.parse(localStorage.getItem("users") || "[]");
  } catch {
    return [];
  }
};

const saveStoredUsers = (users: StoredUser[]) => {
  localStorage.setItem("users", JSON.stringify(users));
};


interface HeaderProps {
  title: string;
  subtitle?: string;
  // showAddButton?: boolean;
}

// Form validation schemas
const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
});

const signupSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  confirmPassword: z.string().min(6, { message: "Password must be at least 6 characters" }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type SignupFormValues = z.infer<typeof signupSchema>;

const Header: React.FC<HeaderProps> = ({ title, subtitle = false }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [showSignupDialog, setShowSignupDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is logged in on mount
  useEffect(() => {
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!user);
  }, []);

  // Listen for custom event to show login dialog (from Sidebar)
  useEffect(() => {
    const handleShowLoginDialog = () => {
      setShowLoginDialog(true);
    };

    window.addEventListener("showLoginDialog", handleShowLoginDialog);

    return () => {
      window.removeEventListener("showLoginDialog", handleShowLoginDialog);
    };
  }, []);

  // Login form handling
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Signup form handling
  const signupForm = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleLoginSubmit = (values: LoginFormValues) => {
    setIsLoading(true);

    // Fake latency so the UI shows loading
    setTimeout(() => {
      const users = getStoredUsers();
      const found = users.find(
        (u) => u.email.toLowerCase() === values.email.toLowerCase()
      );

      // Invalid email or wrong password
      if (!found || found.password !== values.password) {
        setIsLoading(false);

        // mark both fields in the form
        loginForm.setError("email", {
          type: "manual",
          message: "Email or password is incorrect",
        });
        loginForm.setError("password", {
          type: "manual",
          message: "Email or password is incorrect",
        });

        toast({
          title: "Invalid credentials",
          description: "Email or password is incorrect.",
          variant: "destructive",
        });

        return; // keep dialog open
      }

      // Success
      setIsLoading(false);
      setShowLoginDialog(false);

      toast({
        title: "Login Successful",
        description: `Welcome back, ${values.email}!`,
        duration: 3000,
      });

      localStorage.setItem(
        "user",
        JSON.stringify({ email: found.email }) // what you consider your session
      );
      setIsLoggedIn(true);
      // Dispatch event to notify other components of login
      window.dispatchEvent(new CustomEvent("userLoggedIn"));
      navigate("/dashboard");
    }, 800);
  };


  const handleLogout = () => {
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    // Dispatch event to notify other components of logout
    window.dispatchEvent(new CustomEvent("userLoggedOut"));
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
      duration: 3000,
    });
  };

  const handleSignupSubmit = (values: SignupFormValues) => {
    setIsLoading(true);

    setTimeout(() => {
      const users = getStoredUsers();
      const exists = users.some(
        (u) => u.email.toLowerCase() === values.email.toLowerCase()
      );

      if (exists) {
        setIsLoading(false);

        signupForm.setError("email", {
          type: "manual",
          message: "An account with this email already exists",
        });

        toast({
          title: "Email already registered",
          description: "Please log in instead.",
          variant: "destructive",
        });
        return;
      }

      // Store new user (NOTE: plaintext for demo only)
      users.push({ email: values.email, password: values.password });
      saveStoredUsers(users);

      setIsLoading(false);
      setShowSignupDialog(false);

      toast({
        title: "Account Created",
        description: `Welcome, ${values.email}! You can now log in.`,
        duration: 3000,
      });

      // Open login dialog after a tiny delay
      setTimeout(() => setShowLoginDialog(true), 100);
    }, 800);
  };


  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 mb-6">
        <div>
          <h1 className="font-bold text-3xl text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          {/* {showAddButton && (
            <Link to="/add-application">
              <Button variant="secondary" size="default">
                Add Job
              </Button>
            </Link>
          )} */}
          {!isLoggedIn && (
            <Button
              variant="outline"
              onClick={() => setShowSignupDialog(true)}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Sign Up
            </Button>
          )}
          <Button
            variant="secondary"
            onClick={isLoggedIn ? handleLogout : () => setShowLoginDialog(true)}
          >
            {isLoggedIn ? (
              <>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Login Dialog */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Login to Your Account</DialogTitle>
            <DialogDescription>
              Enter your credentials to access your dashboard
            </DialogDescription>
          </DialogHeader>
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLoginSubmit)} className="space-y-4 py-2">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowLoginDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Logging in..." : "Login"}
                </Button>
              </div>
              <div className="text-center text-sm text-gray-500 mt-4">
                Don't have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-purple-600"
                  onClick={() => {
                    setShowLoginDialog(false);
                    setTimeout(() => setShowSignupDialog(true), 100);
                  }}
                >
                  Sign up
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Signup Dialog */}
      <Dialog open={showSignupDialog} onOpenChange={setShowSignupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Create an Account</DialogTitle>
            <DialogDescription>
              Register to track your job applications
            </DialogDescription>
          </DialogHeader>
          <Form {...signupForm}>
            <form onSubmit={signupForm.handleSubmit(handleSignupSubmit)} className="space-y-4 py-2">
              <FormField
                control={signupForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signupForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signupForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowSignupDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Sign Up"}
                </Button>
              </div>
              <div className="text-center text-sm text-gray-500 mt-4">
                Already have an account?{" "}
                <Button
                  variant="link"
                  className="p-0 h-auto text-purple-600"
                  onClick={() => {
                    setShowSignupDialog(false);
                    setTimeout(() => setShowLoginDialog(true), 100);
                  }}
                >
                  Login
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Header;
