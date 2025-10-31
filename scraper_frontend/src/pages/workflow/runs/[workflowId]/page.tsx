
import { useParams } from 'react-router-dom';
import Topbar from '../../_components/topbar/Topbar';
import ExecutionsTable from './_components/ExecutionsTable';

function ExecutionsPage() {
  const { workflowId } = useParams<{ workflowId: string }>();

  if (!workflowId) {
    return <div>Workflow ID is required</div>;
  }

  return (
    <div className="h-full w-full overflow-auto">
      <Topbar
        workflowId={workflowId}
        hideButtons
        title="All runs"
        subtitle="List of all your workflows run"
      />
      <div className="container py-6 w-full">
        <ExecutionsTable workflowId={workflowId} />
      </div>
    </div>
  );
}

export default ExecutionsPage;
