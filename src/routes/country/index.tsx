import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/country/')({
  beforeLoad: () => {
    throw redirect({ to: '/country/discover' });
  },
});
