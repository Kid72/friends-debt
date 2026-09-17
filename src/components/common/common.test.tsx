import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';
import { Card } from './Card';
import { Dialog } from './Dialog';
import { Badge } from './Badge';
import { Avatar } from './Avatar';
import { SegmentedButton } from './SegmentedButton';

describe('Common Atomic Components', () => {
  describe('Button', () => {
    it('renders button with text and triggers click', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click Me</Button>);

      const btn = screen.getByRole('button', { name: /click me/i });
      expect(btn).toBeInTheDocument();
      fireEvent.click(btn);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('renders all variants correctly', () => {
      const { rerender } = render(<Button variant="filled">Filled</Button>);
      let btn = screen.getByRole('button');
      expect(btn.className).toContain('bg-md-primary');

      rerender(<Button variant="tonal">Tonal</Button>);
      btn = screen.getByRole('button');
      expect(btn.className).toContain('bg-md-secondary-container');

      rerender(<Button variant="outlined">Outlined</Button>);
      btn = screen.getByRole('button');
      expect(btn.className).toContain('border');

      rerender(<Button variant="text">Text</Button>);
      btn = screen.getByRole('button');
      expect(btn.className).toContain('text-md-primary');

      rerender(<Button variant="fab">FAB</Button>);
      btn = screen.getByRole('button');
      expect(btn.className).toContain('rounded-2xl');
    });

    it('handles disabled state and prevents clicks', () => {
      const handleClick = vi.fn();
      render(
        <Button disabled onClick={handleClick}>
          Disabled
        </Button>
      );

      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('shows loading indicator and disables interactions', () => {
      const handleClick = vi.fn();
      render(
        <Button loading onClick={handleClick}>
          Submit
        </Button>
      );

      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute('aria-busy', 'true');
      fireEvent.click(btn);
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('renders left and right icons', () => {
      render(
        <Button
          leftIcon={<span data-testid="left-icon">L</span>}
          rightIcon={<span data-testid="right-icon">R</span>}
        >
          Icon Button
        </Button>
      );

      expect(screen.getByTestId('left-icon')).toBeInTheDocument();
      expect(screen.getByTestId('right-icon')).toBeInTheDocument();
    });
  });

  describe('Card', () => {
    it('renders content with default tonal surface', () => {
      render(<Card>Card Content</Card>);
      const card = screen.getByText('Card Content');
      expect(card).toBeInTheDocument();
      expect(card.className).toContain('rounded-3xl');
      expect(card.className).toContain('bg-md-surface-container');
    });

    it('renders variants: elevated, filled, outlined', () => {
      const { rerender } = render(<Card variant="elevated">Elevated</Card>);
      let card = screen.getByText('Elevated');
      expect(card.className).toContain('shadow-sm');

      rerender(<Card variant="filled">Filled</Card>);
      card = screen.getByText('Filled');
      expect(card.className).toContain('bg-md-surface-container-highest');

      rerender(<Card variant="outlined">Outlined</Card>);
      card = screen.getByText('Outlined');
      expect(card.className).toContain('border');
    });

    it('handles interactive mode and keyboard activation', () => {
      const handleClick = vi.fn();
      render(
        <Card interactive onClick={handleClick}>
          Clickable Card
        </Card>
      );

      const card = screen.getByText('Clickable Card');
      expect(card.className).toContain('cursor-pointer');
      fireEvent.click(card);
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyDown(card, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Dialog', () => {
    it('does not render when isOpen is false', () => {
      render(
        <Dialog isOpen={false} onClose={vi.fn()} title="Hidden Title">
          Dialog Body
        </Dialog>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('Hidden Title')).not.toBeInTheDocument();
    });

    it('renders modal with title, description, content and footer when open', () => {
      render(
        <Dialog
          isOpen={true}
          onClose={vi.fn()}
          title="Delete Confirmation"
          description="Are you sure you want to proceed?"
          footer={<button>Confirm</button>}
        >
          <p>Inner content</p>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Delete Confirmation')).toBeInTheDocument();
      expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
      expect(screen.getByText('Inner content')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    });

    it('calls onClose when close button is clicked', () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Test Modal">
          Body
        </Dialog>
      );

      const closeBtn = screen.getByRole('button', { name: /close|bağla/i });
      fireEvent.click(closeBtn);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose on backdrop click if closeOnBackdropClick is true', () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Backdrop Test">
          Body
        </Dialog>
      );

      const backdrop = screen.getByTestId('dialog-backdrop');
      fireEvent.click(backdrop);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose on Escape key press', () => {
      const handleClose = vi.fn();
      render(
        <Dialog isOpen={true} onClose={handleClose} title="Escape Test">
          Body
        </Dialog>
      );

      fireEvent.keyDown(document, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Badge', () => {
    it('renders label with neutral variant by default', () => {
      render(<Badge>Status</Badge>);
      const badge = screen.getByText('Status');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('rounded-full');
      expect(badge.className).toContain('bg-md-surface-container-high');
    });

    it('renders various status colors', () => {
      const { rerender } = render(<Badge variant="success">Success</Badge>);
      let badge = screen.getByText('Success');
      expect(badge.className).toContain('text-emerald-800');

      rerender(<Badge variant="warning">Warning</Badge>);
      badge = screen.getByText('Warning');
      expect(badge.className).toContain('text-amber-900');

      rerender(<Badge variant="error">Error</Badge>);
      badge = screen.getByText('Error');
      expect(badge.className).toContain('bg-md-error-container');

      rerender(<Badge variant="info">Info</Badge>);
      badge = screen.getByText('Info');
      expect(badge.className).toContain('bg-md-tertiary-container');
    });

    it('renders with an optional icon', () => {
      render(
        <Badge icon={<span data-testid="badge-icon">★</span>}>
          Featured
        </Badge>
      );

      expect(screen.getByTestId('badge-icon')).toBeInTheDocument();
      expect(screen.getByText('Featured')).toBeInTheDocument();
    });
  });

  describe('Avatar', () => {
    it('extracts initials correctly from names', () => {
      const { rerender } = render(<Avatar name="Rauf Aliyev" />);
      expect(screen.getByText('RA')).toBeInTheDocument();

      rerender(<Avatar name="Ali" />);
      expect(screen.getByText('A')).toBeInTheDocument();

      rerender(<Avatar name="SingleWordLong" />);
      expect(screen.getByText('S')).toBeInTheDocument();
    });

    it('generates consistent deterministic tonal styling based on name', () => {
      const { rerender, container } = render(<Avatar name="Samir" />);
      const firstClasses = container.firstChild ? (container.firstChild as HTMLElement).className : '';

      rerender(<Avatar name="Samir" />);
      const secondClasses = container.firstChild ? (container.firstChild as HTMLElement).className : '';
      expect(firstClasses).toBe(secondClasses);
    });

    it('supports custom color override with high-contrast text', () => {
      const { container } = render(<Avatar name="Murad" color="#123456" />);
      const el = container.firstChild as HTMLElement;
      expect(el.style.backgroundColor).toBe('rgb(18, 52, 86)');
      expect(el.className).toContain('text-white');
      expect(el.className).toContain('font-medium');
    });

    it('renders image when src provided', () => {
      render(<Avatar name="Leyla" src="https://example.com/avatar.jpg" alt="Leyla photo" />);
      const img = screen.getByRole('img');
      expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg');
      expect(img).toHaveAttribute('alt', 'Leyla photo');
    });
  });

  describe('SegmentedButton', () => {
    const options = [
      { value: 'equal', label: 'Bərabər' },
      { value: 'custom', label: 'Fərdi' },
      { value: 'disabled-opt', label: 'Qeyri-aktiv', disabled: true },
    ];

    it('renders options and highlights selected one', () => {
      render(
        <SegmentedButton
          options={options}
          value="equal"
          onChange={vi.fn()}
        />
      );

      const equalBtn = screen.getByRole('radio', { name: /bərabər/i });
      const customBtn = screen.getByRole('radio', { name: /fərdi/i });

      expect(equalBtn).toHaveAttribute('aria-checked', 'true');
      expect(customBtn).toHaveAttribute('aria-checked', 'false');
      expect(equalBtn.className).toContain('bg-md-surface-container-lowest');
    });

    it('triggers onChange when non-active option is clicked', () => {
      const handleChange = vi.fn();
      render(
        <SegmentedButton
          options={options}
          value="equal"
          onChange={handleChange}
        />
      );

      const customBtn = screen.getByRole('radio', { name: /fərdi/i });
      fireEvent.click(customBtn);
      expect(handleChange).toHaveBeenCalledWith('custom');
    });

    it('does not trigger onChange when disabled option is clicked', () => {
      const handleChange = vi.fn();
      render(
        <SegmentedButton
          options={options}
          value="equal"
          onChange={handleChange}
        />
      );

      const disabledBtn = screen.getByRole('radio', { name: /qeyri-aktiv/i });
      expect(disabledBtn).toBeDisabled();
      fireEvent.click(disabledBtn);
      expect(handleChange).not.toHaveBeenCalled();
    });
  });
});
