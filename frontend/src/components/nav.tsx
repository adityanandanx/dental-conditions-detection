import { GlassesIcon } from "lucide-react";

const Nav = () => {
  return (
    <header>
      <nav className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-4 sm:py-5 border-b">
        <div className="flex gap-2 sm:gap-3 items-center">
          <GlassesIcon className="text-primary" size={24} />
          <h1 className="font-bold leading-none text-sm sm:text-base">
            Dental X-Ray <br />{" "}
            <span className="text-muted-foreground">Analysis AI</span>
          </h1>
        </div>
      </nav>
    </header>
  );
};

export default Nav;
