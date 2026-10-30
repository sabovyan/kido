import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Flag } from '../ui/Flag';

// Learn's quick check: does the kid already know this flag?
export function CheckCard({ code, board, disabled = false, onNotYet }: {
  code: string;
  board: string;
  disabled?: boolean;
  onNotYet: () => void;
}) {
  return (
    <Card padding="sm" className="flex items-center gap-4 max-md:flex-wrap">
      <Flag code={code} alt="Flag to find" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-display text-title-2">Do you know this one?</span>
        <span className="text-body text-fg-muted">Tap its country on the {board}.</span>
      </span>
      <Button size="md" fill disabled={disabled} onClick={onNotYet}>
        Not yet
      </Button>
    </Card>
  );
}
