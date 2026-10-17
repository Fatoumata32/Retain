import { Link as RouterLink } from 'react-router-dom';
import { Button } from '@mui/material';
import { EmptyState } from '../components/common';

export default function NotFoundPage() {
  return (
    <EmptyState
      title="Page not found"
      message="The page you're looking for doesn't exist."
      action={
        <Button component={RouterLink} to="/" variant="contained">
          Go to dashboard
        </Button>
      }
    />
  );
}
