'use client';

import { useState } from 'react';
import { useGameStore } from '@/store/useGameStore';

interface InputGridProps {
  onSubmit: (options: string[]) => void;
  disabled?: boolean;
  category?: string;
}

export default function InputGrid({ onSubmit, disabled = false, category }: InputGridProps) {
  const { user, room } = useGameStore();
  const [options, setOptions] = useState(['', '', '']);
  const [errors, setErrors] = useState<string[]>(['', '', '']);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);

    // Clear error for this field
    const newErrors = [...errors];
    newErrors[index] = '';
    setErrors(newErrors);
  };

  const validateOptions = (): boolean => {
    const newErrors = ['', '', ''];
    let isValid = true;

    options.forEach((option, index) => {
      if (!option.trim()) {
        newErrors[index] = 'This field is required';
        isValid = false;
      } else if (option.trim().length < 2) {
        newErrors[index] = 'Must be at least 2 characters';
        isValid = false;
      } else if (option.trim().length > 50) {
        newErrors[index] = 'Must be less than 50 characters';
        isValid = false;
      }
    });

    // Check for duplicates
    const trimmedOptions = options.map(opt => opt.trim().toLowerCase());
    const uniqueOptions = new Set(trimmedOptions);
    if (uniqueOptions.size !== trimmedOptions.length) {
      newErrors.forEach((_, index) => {
        if (!newErrors[index]) {
          newErrors[index] = 'Duplicate options are not allowed';
        }
      });
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = () => {
    if (validateOptions()) {
      onSubmit(options.map(opt => opt.trim()));
    }
  };



  // Helper to capitalize first letter
  const getCategoryTitle = () => {
    if (!category) return 'Options';
    if (category.toLowerCase() === 'custom') return 'Options';
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          {`Enter Your 3 ${category && category.toLowerCase() === 'custom' ? (category) : getCategoryTitle()}`}
        </h3>
        <p className="text-gray-600 text-sm">
          Put up your best options for voting
        </p>
      </div>

      <div className="space-y-4">
        {options.map((option, index) => (
          <div key={index} className="relative">
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              disabled={disabled}
              className={`
                w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent
                transition-all duration-200
                ${errors[index] 
                  ? 'border-red-300 bg-red-50' 
                  : 'border-gray-300 bg-white hover:border-gray-400'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            />
            {errors[index] && (
              <p className="text-red-500 text-sm mt-1">{errors[index]}</p>
            )}
          </div>
        ))}
      </div>



      <button
        onClick={handleSubmit}
        disabled={disabled || options.some(opt => !opt.trim())}
        className={`
          w-full py-3 px-6 rounded-lg font-semibold text-white
          transition-all duration-200 transform hover:scale-105
          ${disabled || options.some(opt => !opt.trim())
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-primary-600 hover:bg-primary-700 shadow-lg hover:shadow-xl'
          }
        `}
      >
        {disabled ? 'Waiting for other player...' : 'Submit Options'}
      </button>
    </div>
  );
} 