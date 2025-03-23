"use client";
import React, { useEffect, useState } from "react";
import { User, Lock } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { useRouter } from "next/navigation";
import InputComponent from "@/components/InputComponent";
import Button from "@/components/Button";

const SignUp = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, user } = useUserStore();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error when user types
    if (error) setError("");
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    // Basic validation
    if (!formData.username || !formData.password) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }
    
    try {
      await login(formData);
      // Redirect to feeds page after successful signup
      router.push("/feed");
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
          }  else if (errorData.password) {
            setError(`Password: ${errorData.password[0]}`);
          } else {
            setError("Validation error. Please check your inputs.");
          }
        } else {
          setError("An error occurred during login. Please try again.");
        }
      } else if (error.request) {
        // The request was made but no response was received
        setError("No response from server. Please check your internet connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        setError(error.message || "An error occurred during sign in.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
      if(user.isAuthenticated) {
        router.push('/feed');
      }
    }, [user.isAuthenticated, router]);

  return (
    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[95%]">
    <div className="w-full flex flex-col items-center border rounded-sm p-4">
      <div>
        <span className="text-3xl font-semibold text-gray">Sign In</span>
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
          type="password"
          name="password"
          placeholder="Password"
          Icon={Lock}
          isPassword={true}
          value={formData.password}
          onChange={handleChange}
          classwidth="placeholder-black/50"
        />
        </div>

        {error && <p className="text-red-500 font-semibold mt-2">{error}</p>}
        
        <div className="mt-3">
          <Button 
            title={isLoading ? "Logging in..." : "Log In"}
            disabled={isLoading}
          />
        </div>
        <div className="mt-3">
          <p>Don't have an account? <span className="text-link cursor-pointer" onClick={() => router.push("/signup")}>Sign Up</span></p>
        </div>
      </form>
    </div>
    </div>
  );
};

export default SignUp;