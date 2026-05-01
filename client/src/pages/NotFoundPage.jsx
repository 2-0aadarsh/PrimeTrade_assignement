import { Link } from "react-router-dom";

import PageContainer from "../components/layout/PageContainer";

function NotFoundPage() {
  return (
    <PageContainer title="Page not found">
      <section className="card not-found-card">
        <p className="not-found-code" aria-hidden="true">
          404
        </p>
        <p className="not-found-lead">
          This URL isn’t mapped to anything in the app. Check the address or go back to your overview.
        </p>
        <div className="not-found-actions">
          <Link to="/dashboard" className="btn btn-primary">
            Open dashboard
          </Link>
          <Link to="/tasks" className="btn btn-secondary">
            Tasks
          </Link>
        </div>
      </section>
    </PageContainer>
  );
}

export default NotFoundPage;
