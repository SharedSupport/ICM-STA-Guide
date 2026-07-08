import { loginUrl } from "../authClient";

export function SignIn() {
  return (
    <div className="signin-screen">
      <div className="signin-card">
        <div className="app-title">Program Portal</div>
        <p>Sign in with your Shared Support Microsoft account to view your caseload brief.</p>
        <a className="signin-button" href={loginUrl()}>
          Sign in with Microsoft
        </a>
      </div>
    </div>
  );
}
