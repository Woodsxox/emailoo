import React from "react";
import { SignIn } from "@clerk/nextjs";

const signInPage = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <SignIn signUpUrl="/sign-up" />
    </div>
  );
};

export default signInPage;
