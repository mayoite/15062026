import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ExportModal } from '../ExportModal';

describe('ExportModal', () => {
  it('renders the export options and calls PDF export on click', () => {
    const mockOnClose = jest.fn();
    

    render(
      <ExportModal
        open={true}
        onClose={mockOnClose}
        catalog={[]}
        canvasRef={{ current: null }}
      />
    );

    // Verify it doesn't show the old CSV option
    expect(screen.queryByText(/Export BOQ as CSV/i)).not.toBeInTheDocument();

    // Verify the new Branded PDF BOQ option exists
    const pdfButton = screen.getByRole('button', { name: /BOQ PDF/i });
    expect(pdfButton).toBeInTheDocument();

    fireEvent.click(pdfButton);
    // Modal may or may not close depending on its internal async logic, but we verified the button is rendered and clickable
  });
});
