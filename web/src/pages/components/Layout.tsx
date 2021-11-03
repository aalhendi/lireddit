import React from "react";
import NavBar from "./NavBar";

interface LayoutProps {}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="content">
      <NavBar />
      {children}
    </div>
  );
};

export default Layout;