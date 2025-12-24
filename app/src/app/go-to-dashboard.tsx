'use client';
import { redirect } from 'next/navigation';

export default function GoToDashboard() {
  redirect('/dashboard');
  return null;
}
