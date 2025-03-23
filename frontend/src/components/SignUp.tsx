"use client";
import React, { useState } from "react";
import InputComponent from "./InputComponent";
import { Mail, User, Lock } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import PasswordStrengthMeter from "./PasswordStrengthMeter";
import Button from "./Button";
import { useRouter } from "next/navigation";

const SignUp = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { signup } = useUserStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Basic validation
    if (!formData.username || !formData.email || !formData.password || !formData.password_confirm) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }
    
    // Password validation
    if (formData.password !== formData.password_confirm) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    
    try {
      await signup(formData);
      // Redirect to feeds page after successful signup
      router.push("/login");
    } catch (error: any) {
      // Handle specific API errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 400) {
          // Handle validation errors from the API
          const errorData = error.response.data;
          if (errorData.username) {
            setError(`Username: ${errorData.username[0]}`);
          } else if (errorData.email) {
            setError(`Email: ${errorData.email[0]}`);
          } else if (errorData.password) {
            setError(`Password: ${errorData.password[0]}`);
          } else {
            setError("Validation error. Please check your inputs.");
          }
        } else {
          setError("An error occurred during signup. Please try again.");
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError("No response from server. Please check your internet connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(error.message || "An error occurred during signup.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex flex-col items-center border rounded-sm p-4">
      <div>
        <span className="text-3xl font-semibold text-gray">Get Started</span>
      </div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col items-center w-[90%] mt-3"
      >
        <div className="flex flex-col gap-3">
        <InputComponent
          type="text"
          name="username"
          placeholder="Username"
          Icon={User}
          value={formData.username}
          onChange={handleChange}
          classwidth="placeholder-black/50"
        />
        <InputComponent
          type="text"
          name="email"
          placeholder="Email"
          Icon={Mail}
          value={formData.email}
          onChange={handleChange}
          classwidth="placeholder-black/50"
        />
        <InputComponent
          type="password"
          name="password"
          placeholder="Password"
          Icon={Lock}
          isPassword={true}
          value={formData.password}
          onChange={handleChange}
          classwidth="placeholder-black/50"
        />
        <InputComponent
          type="password"
          name="password_confirm"
          placeholder="Confirm Password"
          Icon={Lock}
          isPassword={true}
          value={formData.password_confirm}
          onChange={handleChange}
          classwidth="placeholder-black/50"
        />
        </div>

        {error && <p className="text-red-500 font-semibold mt-2">{error}</p>}
        <div className="w-full">
          <PasswordStrengthMeter password={formData.password} />
        </div>
        <div className="mt-3">
          <Button 
            title={isLoading ? "Signing Up..." : "Sign Up"}
            disabled={isLoading}
          />
        </div>
        <div className="mt-3">
          <p>Have an account? <span className="text-link cursor-pointer" onClick={() => router.push("/login")}>Log in</span></p>
        </div>
      </form>
    </div>
  );
};

export default SignUp;