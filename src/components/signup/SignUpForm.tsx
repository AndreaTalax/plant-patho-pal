
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Mail, LockKeyhole } from "lucide-react";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Define the validation schema for the sign-up form
const signUpSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(6, { message: "Password must contain at least 6 characters" }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  isLoading: boolean;
  onSubmit: (values: SignUpFormValues) => Promise<void>;
}

/**
* Renders a sign-up form allowing users to create a new account.
* @example
* SignUpForm({isLoading: false, onSubmit: handleSubmit})
* JSX.Element
* @param {boolean} isLoading - Indicates whether the form submission is in progress.
* @param {function} onSubmit - Callback function to handle form submission.
* @returns {JSX.Element} The rendered sign-up form component.
* @description
*   - Utilizes a form validation schema using Zod resolver.
*   - Provides default empty values for email, password, and confirm password fields.
*   - Conditional button text based on the isLoading state.
*   - Provides links and messages for post-registration.
*/
export const SignUpForm = ({ isLoading, onSubmit }: SignUpFormProps) => {
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  return (
    <>
      <CardHeader>
        <CardTitle className="text-2xl text-drplant-blue-dark text-center">Create an account</CardTitle>
        <CardDescription className="text-center">
          Enter your details to register
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="name@example.com" 
                        className="pl-10" 
                        type="email" 
                        autoComplete="email"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="Minimum 6 characters" 
                        className="pl-10" 
                        type="password" 
                        autoComplete="new-password"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm password</FormLabel>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <FormControl>
                      <Input 
                        {...field}
                        placeholder="Repeat password" 
                        className="pl-10" 
                        type="password" 
                        autoComplete="new-password"
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="pt-2">
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-drplant-blue to-drplant-blue-dark hover:from-drplant-blue-dark hover:to-drplant-blue-dark transition-all duration-300"
                disabled={isLoading}
              >
                {isLoading ? "Registering..." : "Register"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 text-sm text-gray-500">
        <div className="text-center w-full">
          Already have an account? <Link to="/login" className="text-drplant-blue font-medium hover:underline">Login</Link>
        </div>
        <p className="text-xs text-gray-500 text-center">
          By registering, you agree to our terms of service and privacy policy.
        </p>
      </CardFooter>
    </>
  );
};
