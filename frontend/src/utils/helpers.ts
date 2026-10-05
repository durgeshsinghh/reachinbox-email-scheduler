import { format } from 'date-fns';
import Papa from 'papaparse';
import { EmailStatus } from '../types';
import { useEffect, useState } from 'react';

export function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function formatDate(dateString: string) {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  } catch (e) {
    return dateString;
  }
}

export function formatDateTime(dateString: string) {
  return formatDate(dateString);
}

export function getStatusColor(status: EmailStatus) {
  switch (status) {
    case 'scheduled':
      return { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-400' };
    case 'queued':
      return { bg: 'bg-blue-100', text: 'text-blue-800', dot: 'bg-blue-400' };
    case 'sending':
      return { bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-400' };
    case 'sent':
      return { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-400' };
    case 'failed':
      return { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-400' };
    case 'rate_limited':
      return { bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-400' };
    default:
      return { bg: 'bg-gray-100', text: 'text-gray-800', dot: 'bg-gray-400' };
  }
}

export function parseCSVEmails(file: File): Promise<string[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.data || results.data.length === 0) {
          return reject(new Error('CSV is empty'));
        }
        
        const firstRow = results.data[0] as any;
        const emailKey = Object.keys(firstRow).find(key => key.toLowerCase().includes('email')) || Object.keys(firstRow)[0];
        
        if (!emailKey) {
          return reject(new Error('Could not find email column'));
        }
        
        const emails = results.data
          .map((row: any) => row[emailKey]?.trim())
          .filter((email: string) => email && email.includes('@'));
          
        resolve([...new Set(emails)]); // Return unique
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

// React hook for debouncing
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
