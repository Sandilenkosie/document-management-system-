import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "../store/Auth";
import type { LoginRequestPayload } from "../type/Auth";
import { apiClient } from "../api/client";
import { toast } from "sonner";

type LoginValidationErrors = {
  email?: string;
  password?: string;
};

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, user, isAuthInitialized } =
    useAuthStore();
  const [formData, setFormData] = useState<LoginRequestPayload>({
    email: "",
    password: "",
    rememberMe: false,
  });
  const [validationErrors, setValidationErrors] =
    useState<LoginValidationErrors>({});

  useEffect(() => {
    if (isAuthInitialized && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthInitialized, user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "email" || name === "password") {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): LoginValidationErrors => {
    const errors: LoginValidationErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email.trim()) {
      errors.email = "Please enter your email address.";
    } else if (!emailPattern.test(formData.email.trim())) {
      errors.email =
        "Please enter a valid email address, for example name@company.com.";
    }

    if (!formData.password) {
      errors.password = "Please enter your password.";
    }

    return errors;
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      toast.error("Enter your email first");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(formData.email.trim())) {
      toast.error("Please enter a valid email address first.");
      return;
    }

    try {
      const response = await apiClient.forgotPassword(formData.email);
      toast.success(response.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    const errors = validateForm();

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});

    console.log("Login attempt with:", formData);

    try {
      await login(formData);
      console.log("Login successful, navigating to dashboard");
      // Add a small delay to ensure state is updated
      setTimeout(() => {
        navigate("/dashboard");
      }, 100);
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-crypto-blue">
      <div className="w-full max-w-md p-8 bg-crypto-dark-blue rounded-lg shadow-lg border border-crypto-purple/20">
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Sign In
        </h1>
        <p className="text-gray-300 text-center mb-6">
          Welcome back to your document workspace
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              aria-invalid={Boolean(validationErrors.email)}
              className="bg-crypto-dark-purple/40 border-crypto-purple/30 text-white placeholder-gray-500"
            />
            {validationErrors.email && (
              <p className="mt-1 text-sm text-red-300">
                {validationErrors.email}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Password
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
              aria-invalid={Boolean(validationErrors.password)}
              className="bg-crypto-dark-purple/40 border-crypto-purple/30 text-white placeholder-gray-500"
            />
            {validationErrors.password && (
              <p className="mt-1 text-sm text-red-300">
                {validationErrors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                name="rememberMe"
                checked={Boolean(formData.rememberMe)}
                onChange={handleChange}
                className="h-4 w-4 rounded border-crypto-purple/40 bg-crypto-dark-purple/40"
              />
              Remember me
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-crypto-purple hover:text-crypto-light-purple"
            >
              Forgot password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-crypto-purple hover:bg-crypto-dark-purple text-white mt-6"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-300">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-crypto-purple hover:text-crypto-light-purple"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
