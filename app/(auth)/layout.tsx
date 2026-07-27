import "./auth.css";

type AuthLayoutProps = {
  children: React.ReactNode;
};

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
