import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "../store/Auth";
import type { RegisterRequestPayload } from "../type/Auth";

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
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await register(formData);
      setRegistrationSuccess(true);
    } catch (err) {
      console.error("Registration error:", err);
    }
  };

  // Success screen
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-crypto-blue">
        <div className="w-full max-w-md p-8 bg-crypto-dark-blue rounded-lg shadow-lg border border-crypto-purple/20">
          <div className="text-center">
            <div className="mb-4 text-4xl">✓</div>
            <h1 className="text-2xl font-bold text-white text-center mb-2">
              Account Created!
            </h1>
            <p className="text-gray-300 text-center mb-6">
              A verification email has been sent to
            </p>
            <p className="text-crypto-purple font-semibold mb-6">
              {formData.email}
            </p>
            <p className="text-gray-300 text-sm mb-6">
              Please check your email and click the verification link to
              activate your account.
            </p>

            <Button
              onClick={() => navigate("/")}
              className="w-full bg-crypto-purple hover:bg-crypto-dark-purple text-white"
            >
              Go to Home
            </Button>

            <div className="mt-4 text-center">
              <p className="text-gray-300 text-sm">
                Didn't receive the email?{" "}
                <a
                  href="#"
                  className="text-crypto-purple hover:text-crypto-light-purple"
                >
                  Resend verification email
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              className="bg-crypto-dark-purple/40 border-crypto-purple/30 text-white placeholder-gray-500"
            />
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
              className="bg-crypto-dark-purple/40 border-crypto-purple/30 text-white placeholder-gray-500"
            />
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
              className="bg-crypto-dark-purple/40 border-crypto-purple/30 text-white placeholder-gray-500"
            />
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
              className="bg-crypto-dark-purple/40 border-crypto-purple/30 text-white placeholder-gray-500"
            />
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
              className="bg-crypto-dark-purple/40 border-crypto-purple/30 text-white placeholder-gray-500"
            />
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
