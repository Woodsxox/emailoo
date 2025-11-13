import React from "react";
import { SignUp } from "@clerk/nextjs";

const signUpPage = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <SignUp />
    </div>
  );
};

export default signUpPage;
