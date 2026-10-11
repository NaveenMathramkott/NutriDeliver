"use client";

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch } from "@/store/hooks";
import { loginUser } from "@/store/slices/authSlice";
import { toast } from "@/hooks/use-toast";
import { LoginForm } from "@/features/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await dispatch(loginUser({ email, password })).unwrap();
      toast({
        title: "Welcome back!",
        description: "You have been logged in successfully.",
        variant: "success",
      });
      navigate("/");
    } catch (err: any) {
      const message = err?.message || "Invalid email or password";
      setError(message);
      toast({
        title: "Login failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LoginForm
      email={email}
      onEmailChange={setEmail}
      password={password}
      onPasswordChange={setPassword}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
}
