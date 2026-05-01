import { NavLink } from "react-router-dom";

function AppNav({ isAuthenticated, role }) {
  if (!isAuthenticated) return null;

  return (
    <nav aria-label="Main navigation" className="app-nav">
      <ul>
        <li>
          <NavLink
            to="/dashboard"
            className={({ isActive }) => `app-nav__link${isActive ? " app-nav__link--active" : ""}`}
            end
          >
            Overview
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/tasks"
            className={({ isActive }) => `app-nav__link${isActive ? " app-nav__link--active" : ""}`}
          >
            Tasks
          </NavLink>
        </li>
        {role === "admin" ? (
          <li>
            <NavLink
              to="/admin"
              className={({ isActive }) => `app-nav__link${isActive ? " app-nav__link--active" : ""}`}
            >
              Admin
            </NavLink>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}

export default AppNav;
