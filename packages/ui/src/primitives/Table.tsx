import React from 'react';

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'var(--wr-font-sans)',
  fontSize: 'var(--wr-text-base)',
  color: 'var(--wr-text-primary)',
};

const headerStyle: React.CSSProperties = {
  borderBottom: '2px solid var(--wr-border-default)',
  background: 'var(--wr-bg-elevated)',
};

const bodyStyle: React.CSSProperties = {};

const footerStyle: React.CSSProperties = {
  borderTop: '2px solid var(--wr-border-default)',
  background: 'var(--wr-bg-elevated)',
  fontWeight: 'var(--wr-font-semibold)',
};

const rowStyle: React.CSSProperties = {
  borderBottom: '1px solid var(--wr-border-subtle)',
  transition: 'background var(--wr-transition-fast)',
};

const headCellStyle: React.CSSProperties = {
  padding: 'var(--wr-space-3) var(--wr-space-4)',
  fontWeight: 'var(--wr-font-semibold)',
  color: 'var(--wr-text-secondary)',
  fontSize: 'var(--wr-text-sm)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  textAlign: 'left',
};

const cellStyle: React.CSSProperties = {
  padding: 'var(--wr-space-3) var(--wr-space-4)',
  verticalAlign: 'middle',
};

const captionStyle: React.CSSProperties = {
  padding: 'var(--wr-space-2)',
  color: 'var(--wr-text-muted)',
  fontSize: 'var(--wr-text-xs)',
};

export const Table = React.forwardRef<HTMLTableElement, React.TableHTMLAttributes<HTMLTableElement>>(
  ({ style, ...props }, ref) => (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <table ref={ref} style={{ ...tableStyle, ...style }} {...props} />
    </div>
  ),
);
Table.displayName = 'Table';

export const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ style, ...props }, ref) => (
    <thead ref={ref} style={{ ...headerStyle, ...style }} {...props} />
  ),
);
TableHeader.displayName = 'TableHeader';

export const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ style, ...props }, ref) => (
    <tbody ref={ref} style={{ ...bodyStyle, ...style }} {...props} />
  ),
);
TableBody.displayName = 'TableBody';

export const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({ style, ...props }, ref) => (
    <tfoot ref={ref} style={{ ...footerStyle, ...style }} {...props} />
  ),
);
TableFooter.displayName = 'TableFooter';

export const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ style, ...props }, ref) => {
    const [isHovered, setIsHovered] = React.useState(false);
    return (
      <tr
        ref={ref}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          ...rowStyle,
          backgroundColor: isHovered ? 'var(--wr-border-subtle)' : 'transparent',
          ...style,
        }}
        {...props}
      />
    );
  },
);
TableRow.displayName = 'TableRow';

export const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ style, ...props }, ref) => (
    <th ref={ref} style={{ ...headCellStyle, ...style }} {...props} />
  ),
);
TableHead.displayName = 'TableHead';

export const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ style, ...props }, ref) => (
    <td ref={ref} style={{ ...cellStyle, ...style }} {...props} />
  ),
);
TableCell.displayName = 'TableCell';

export const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({ style, ...props }, ref) => (
    <caption ref={ref} style={{ ...captionStyle, ...style }} {...props} />
  ),
);
TableCaption.displayName = 'TableCaption';
