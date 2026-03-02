import { Waves } from "lucide-react";

export function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-5 md:px-10">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
          <Waves className="h-5 w-5 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Olitas
          </h1>
          <p className="text-xs text-muted-foreground">Enterate antes de ir</p>
        </div>
      </div>
    </header>
  );
}
