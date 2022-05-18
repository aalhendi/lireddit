import { AppPropsType } from "next/dist/shared/lib/utils";
import React from "react";
import NavBar from "./NavBar";

interface LayoutProps {
  children: React.ReactNode;
  pageProps: AppPropsType;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="content">
      <NavBar pageProps />
      {children}
    </div>
  );
};

export default Layout;
