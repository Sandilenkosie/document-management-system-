import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "../store/Auth";
import type { RegisterRequestPayload } from "../type/Auth";

type RegisterValidationErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState<RegisterRequestPayload>({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    role: "USER",
  });
  const [validationErrors, setValidationErrors] =
    useState<RegisterValidationErrors>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (
      name === "firstName" ||
      name === "lastName" ||
      name === "email" ||
      name === "password" ||
      name === "confirmPassword"
    ) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): RegisterValidationErrors => {
    const errors: RegisterValidationErrors = {};
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.firstName.trim()) {
      errors.firstName = "Please enter your first name.";
    }

    if (!formData.lastName.trim()) {
      errors.lastName = "Please enter your last name.";
    }

    if (!formData.email.trim()) {
      errors.email = "Please enter your email address.";
    } else if (!emailPattern.test(formData.email.trim())) {
      errors.email =
        "Please enter a valid email address, for example name@company.com.";
    }

    if (!formData.password) {
      errors.password = "Please enter a password with at least 6 characters.";
    } else if (formData.password.length < 6) {
      errors.password = "Your password must be at least 6 characters long.";
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (formData.confirmPassword !== formData.password) {
      errors.confirmPassword =
        "Passwords do not match. Please enter the same password in both fields.";
    }

    return errors;
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

    try {
      await register(formData);
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error("Registration error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-crypto-blue">
      <div className="w-full max-w-md p-8 bg-crypto-dark-blue rounded-lg shadow-lg border border-crypto-purple/20">
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          Create Account
        </h1>
        <p className="text-gray-300 text-center mb-6">
          Join the web-based document management system
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 text-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              First Name
            </label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="Enter your first name"
              required
              aria-invalid={Boolean(validationErrors.firstName)}
              className="bg-crypto-dark-purple/40 border-crypto-purple/30 text-white placeholder-gray-500"
            />
            {validationErrors.firstName && (
              <p className="mt-1 text-sm text-red-300">
                {validationErrors.firstName}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Last Name
            </label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Enter your last name"
              required
              aria-invalid={Boolean(validationErrors.lastName)}
              className="bg-crypto-dark-purple/40 border-crypto-purple/30 text-white placeholder-gray-500"
            />
            {validationErrors.lastName && (
              <p className="mt-1 text-sm text-red-300">
                {validationErrors.lastName}
              </p>
            )}
          </div>

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
              placeholder="Enter password (min 6 characters)"
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

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
              aria-invalid={Boolean(validationErrors.confirmPassword)}
              className="bg-crypto-dark-purple/40 border-crypto-purple/30 text-white placeholder-gray-500"
            />
            {validationErrors.confirmPassword && (
              <p className="mt-1 text-sm text-red-300">
                {validationErrors.confirmPassword}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-crypto-purple hover:bg-crypto-dark-purple text-white mt-6"
          >
            {isLoading ? "Creating Account..." : "Register"}
          </Button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-300">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-crypto-purple hover:text-crypto-light-purple"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
