import { GlassesIcon } from "lucide-react";

const Nav = () => {
  return (
    <header>
      <nav className="flex items-center justify-between px-10 py-5 border-b">
        <div className="flex gap-3 items-center">
          <GlassesIcon className="text-primary" size={32} />
          <h1 className="font-bold leading-none">
            Dental X-Ray <br />{" "}
            <span className="text-muted-foreground">Analysis AI</span>
          </h1>
        </div>
      </nav>
    </header>
  );
};

export default Nav;
