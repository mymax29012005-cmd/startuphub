import React from "react";

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={["glass rounded-3xl", className ?? ""].join(" ")}>{children}</div>
  );
}

