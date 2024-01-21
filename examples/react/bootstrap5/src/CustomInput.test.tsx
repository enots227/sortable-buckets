import React from 'react';
import { render, screen } from '@testing-library/react';
import CustomInput from './CustomInput';

test('renders learn react link', () => {
  render(<CustomInput />);
  const elem = screen.getByText(/learn react/i);
  expect(elem).toBeInTheDocument();
});
