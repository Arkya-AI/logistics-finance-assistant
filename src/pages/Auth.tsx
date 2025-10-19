import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthProvider";

// Validation schemas
const email = z.string().email('Enter a valid email');
const password = z.string()
  .min(8, 'Min 8 characters')
  .max(128, 'Max 128 characters')
  .regex(/[A-Z]/, 'Add an uppercase')
  .regex(/[a-z]/, 'Add a lowercase')
  .regex(/[0-9]/, 'Add a number');

const signupSchema = z.object({
  email,
  password,
  confirm: z.string()
}).refine(d => d.password === d.confirm, {
  path: ['confirm'],
  message: 'Passwords do not match'
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password required')
});

type SignupFormData = z.infer<typeof signupSchema>;
type LoginFormData = z.infer<typeof loginSchema>;

const Auth = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { session } = useAuth();

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirm: "" }
  });

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" }
  });

  // Redirect if already logged in
  if (session) {
    navigate("/");
    return null;
  }

  const handleSignUp = async (data: SignupFormData) => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast({
        title: "Account created!",
        description: "You can now sign in with your credentials.",
      });
      navigate("/");
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleSignIn = async (data: LoginFormData) => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've successfully signed in.",
      });
      navigate("/");
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Logistics Finance Assistant</CardTitle>
          <CardDescription>Sign in or create an account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          {authError && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={loginForm.handleSubmit(handleSignIn)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!loginForm.formState.isValid || loginForm.formState.isSubmitting}
                >
                  {loginForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={signupForm.handleSubmit(handleSignUp)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    {...signupForm.register("email")}
                  />
                  {signupForm.formState.errors.email && (
                    <p className="text-sm text-destructive">
                      {signupForm.formState.errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    {...signupForm.register("password")}
                  />
                  {signupForm.formState.errors.password && (
                    <p className="text-sm text-destructive">
                      {signupForm.formState.errors.password.message}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm">Confirm Password</Label>
                  <Input
                    id="signup-confirm"
                    type="password"
                    {...signupForm.register("confirm")}
                  />
                  {signupForm.formState.errors.confirm && (
                    <p className="text-sm text-destructive">
                      {signupForm.formState.errors.confirm.message}
                    </p>
                  )}
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={!signupForm.formState.isValid || signupForm.formState.isSubmitting}
                >
                  {signupForm.formState.isSubmitting ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
