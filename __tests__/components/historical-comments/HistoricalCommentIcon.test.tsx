import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { HistoricalCommentIcon } from '@/components/HistoricalCommentIcon'

describe('HistoricalCommentIcon', () => {
  it('should render with count', () => {
    const onClick = jest.fn()
    render(<HistoricalCommentIcon count={5} onClick={onClick} />)

    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveAttribute(
      'aria-label',
      '5 ציטוטים היסטוריים'
    )
  })

  it('should hide when count is 0', () => {
    const onClick = jest.fn()
    const { container } = render(
      <HistoricalCommentIcon count={0} onClick={onClick} />
    )

    expect(container.firstChild).toBeNull()
  })

  it('should call onClick handler when clicked', () => {
    const onClick = jest.fn()
    render(<HistoricalCommentIcon count={3} onClick={onClick} />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should stop event propagation when clicked', () => {
    const onClick = jest.fn()
    const parentClick = jest.fn()

    const { container } = render(
      <div onClick={parentClick}>
        <HistoricalCommentIcon count={3} onClick={onClick} />
      </div>
    )

    const button = screen.getByRole('button')
    fireEvent.click(button)

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(parentClick).not.toHaveBeenCalled()
  })

  it('should handle Enter key press', () => {
    const onClick = jest.fn()
    render(<HistoricalCommentIcon count={3} onClick={onClick} />)

    const button = screen.getByRole('button')
    fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should handle Space key press', () => {
    const onClick = jest.fn()
    render(<HistoricalCommentIcon count={3} onClick={onClick} />)

    const button = screen.getByRole('button')
    fireEvent.keyDown(button, { key: ' ', code: 'Space' })

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('should not call onClick for other keys', () => {
    const onClick = jest.fn()
    render(<HistoricalCommentIcon count={3} onClick={onClick} />)

    const button = screen.getByRole('button')
    fireEvent.keyDown(button, { key: 'Escape', code: 'Escape' })

    expect(onClick).not.toHaveBeenCalled()
  })

  it('should display correct badge number', () => {
    const onClick = jest.fn()
    render(<HistoricalCommentIcon count={15} onClick={onClick} />)

    expect(screen.getByText('15')).toBeInTheDocument()
  })

  it('should accept custom className', () => {
    const onClick = jest.fn()
    const { container } = render(
      <HistoricalCommentIcon
        count={3}
        onClick={onClick}
        className="custom-class"
      />
    )

    const button = container.querySelector('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should have proper accessibility attributes', () => {
    const onClick = jest.fn()
    render(<HistoricalCommentIcon count={7} onClick={onClick} />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'button')
    expect(button).toHaveAttribute('tabIndex', '0')
    expect(button).toHaveAttribute('aria-label', '7 ציטוטים היסטוריים')
    expect(button).toHaveAttribute('title', '7 ציטוטים היסטוריים')
  })

  it('should render icon with aria-hidden', () => {
    const onClick = jest.fn()
    const { container } = render(
      <HistoricalCommentIcon count={3} onClick={onClick} />
    )

    const icon = container.querySelector('svg')
    expect(icon).toHaveAttribute('aria-hidden', 'true')
  })
})
