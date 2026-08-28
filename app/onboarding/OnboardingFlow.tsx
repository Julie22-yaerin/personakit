'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ONBOARDING_STEPS,
  STEP_ORDER,
  type OnboardingData,
  type OnboardingStepId,
  type Field,
  getNextStepId,
  getPrevStepId,
  getStepProgress,
  getStepById,
} from '@/lib/onboarding-questions';
import { Logo } from '@/components/landing/Logo';
import { authedFetch } from '@/lib/api-client';

type Option = { value: string; label: string };

interface SingleSelectProps {
  value: string;
  options: readonly Option[];
  onChange: (v: string) => void;
  required?: boolean;
  disabled?: boolean;
}

function SingleSelect({ value, options, onChange, required, disabled = false }: SingleSelectProps) {
  return (
    <div className="field-group">
      {options.map((opt) => (
        <label key={opt.value} className={`option-card ${value === opt.value ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}>
          <input
            type="radio"
            name={`single-${Math.random()}`}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => !disabled && onChange(opt.value)}
            disabled={disabled}
          />
          <span className="option-label">{opt.label}</span>
        </label>
      ))}
      {required && !value && <p className="field-error">Required</p>}
    </div>
  );
}

function MultiSelect({
  value,
  options,
  onChange,
  required,
  max,
  min,
  disabled = false,
}: {
  value: string[];
  options: readonly Option[];
  onChange: (v: string[]) => void;
  required?: boolean;
  max?: number;
  min?: number;
  disabled?: boolean;
}) {
  const toggle = (val: string) => {
    if (disabled) return;
    const next = value.includes(val) ? value.filter((v) => v !== val) : [...value, val];
    if (max && next.length > max) return;
    onChange(next);
  };
  const count = value.length;
  const maxText = max ? ` (max ${max})` : '';
  const minText = min ? ` (min ${min})` : '';
  return (
    <div className="field-group">
      {options.map((opt) => (
        <label key={opt.value} className={`option-card ${value.includes(opt.value) ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}>
          <input
            type="checkbox"
            value={opt.value}
            checked={value.includes(opt.value)}
            onChange={() => toggle(opt.value)}
            disabled={disabled}
          />
          <span className="option-label">{opt.label}</span>
        </label>
      ))}
      <p className="field-hint">Selected: {count}{maxText}{minText}</p>
      {required && (!value.length || (min && count < min)) && <p className="field-error">Required</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  required,
  maxLength,
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  multiline?: boolean;
}) {
  return (
    <div className="field-group">
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          className="text-input"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          className="text-input"
        />
      )}
      <p className="field-hint">{value.length}/{maxLength}</p>
      {required && !value.trim() && <p className="field-error">Required</p>}
    </div>
  );
}

function ScaleInput({
  value,
  onChange,
  min,
  max,
  labels,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  labels: Record<number, string>;
}) {
  return (
    <div className="field-group scale-input">
      <div className="scale-labels">
        <span>{labels[min]}</span>
        <span>{labels[max]}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="scale-slider"
      />
      <div className="scale-value">{value}</div>
    </div>
  );
}

function RankedSelect({
  value,
  options,
  onChange,
  required,
}: {
  value: string[];
  options: Option[];
  onChange: (v: string[]) => void;
  required?: boolean;
}) {
  const moveUp = (idx: number) => {
    if (idx === 0) return;
    const next = [...value];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onChange(next);
  };
  const moveDown = (idx: number) => {
    if (idx === value.length - 1) return;
    const next = [...value];
    [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
    onChange(next);
  };
  const remove = (val: string) => onChange(value.filter((v) => v !== val));
  const available = options.filter((o) => !value.includes(o.value));
  return (
    <div className="field-group ranked">
      <div className="ranked-selected">
        {value.map((val, idx) => {
          const opt = options.find((o) => o.value === val);
          return (
            <div key={val} className="ranked-item">
              <span className="rank-badge">{idx + 1}</span>
              <span>{opt?.label}</span>
              <button type="button" onClick={() => moveUp(idx)} disabled={idx === 0} aria-label="Move up">↑</button>
              <button type="button" onClick={() => moveDown(idx)} disabled={idx === value.length - 1} aria-label="Move down">↓</button>
              <button type="button" onClick={() => remove(val)} aria-label="Remove">×</button>
            </div>
          );
        })}
      </div>
      {available.length > 0 && (
        <div className="ranked-available">
          {available.map((opt) => (
            <button key={opt.value} type="button" onClick={() => onChange([...value, opt.value])} className="add-option">
              + {opt.label}
            </button>
          ))}
        </div>
      )}
      {required && value.length < options.length && <p className="field-error">Rank all options</p>}
    </div>
  );
}

function DynamicBottleneckSelect({
  painPoints,
  value,
  onChange,
}: {
  painPoints: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const options: readonly Option[] = painPoints.map((p) => ({ value: p, label: p.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }));
  return <SingleSelect value={value} options={options} onChange={onChange} required />;
}

function StepContent({
  step,
  data,
  updateData,
  errors,
}: {
  step: typeof ONBOARDING_STEPS[number];
  data: OnboardingData;
  updateData: (k: keyof OnboardingData, v: any) => void;
  errors: Partial<Record<keyof OnboardingData, string>>;
}) {
  const getString = (key: keyof OnboardingData): string => data[key] as string;
  const getStringArray = (key: keyof OnboardingData): string[] => data[key] as string[];
  const getNumber = (key: keyof OnboardingData): number => data[key] as number;

  return (
    <form className="onboarding-form" noValidate>
      <h1 className="step-title">{step.title}</h1>
      <p className="step-subtitle">{step.subtitle}</p>
      {step.fields.map((field) => (
        <div key={field.key} className="field">
          {field.type === 'single-select' && (
            <SingleSelect
              value={getString(field.key)}
              options={field.options ?? []}
              onChange={(v) => updateData(field.key, v)}
              required={field.required}
              disabled={field.disabled}
            />
          )}
          {field.type === 'multi-select' && (
            <MultiSelect
              value={getStringArray(field.key)}
              options={field.options ?? []}
              onChange={(v) => updateData(field.key, v)}
              required={field.required}
              max={field.max}
              min={field.min}
              disabled={field.disabled}
            />
          )}
          {field.type === 'text' && (
            <TextInput
              value={getString(field.key)}
              onChange={(v) => updateData(field.key, v)}
              placeholder={field.placeholder}
              required={field.required}
              maxLength={field.maxLength}
              multiline={field.multiline}
            />
          )}
          {field.type === 'scale' && (
            <ScaleInput
              value={getNumber(field.key)}
              onChange={(v) => updateData(field.key, v)}
              min={field.min}
              max={field.max}
              labels={field.labels}
            />
          )}
          {field.type === 'ranked-select' && (
            <RankedSelect
              value={getStringArray(field.key)}
              options={(field.options ?? []) as Option[]}
              onChange={(v) => updateData(field.key, v)}
              required={field.required}
            />
          )}
          {field.key === 'biggestBottleneck' && (
            <DynamicBottleneckSelect
              painPoints={getStringArray('painPoints')}
              value={getString('biggestBottleneck')}
              onChange={(v) => updateData('biggestBottleneck', v)}
            />
          )}
        </div>
      ))}
    </form>
  );
}

const INITIAL_DATA: OnboardingData = {
  founderType: '',
  traits: [],
  oneSentence: '',
  perceptionGoals: [],
  perceptionAntiGoals: [],
  companyName: '',
  whatYouBuild: '',
  targetAudience: [],
  brandPersonality: [],
  primaryGoal: '',
  priorityRanking: [],
  painPoints: [],
  biggestBottleneck: '',
  timePerWeek: '',
  filmingComfort: 3,
  editingWillingness: '',
  creationLocation: [],
  thirtyDayGoal: '',
};

function OnboardingProgress({ currentStep }: { currentStep: OnboardingStepId }) {
  const { current, total, percent } = getStepProgress(currentStep);
  return (
    <div className="onboarding-progress" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <p className="progress-text">Step {current} of {total}</p>
    </div>
  );
}

export default function OnboardingFlow() {
  const router = useRouter();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [data, setData] = useState<OnboardingData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingData, string>>>({});
  const [submitted, setSubmitted] = useState(false);

  const currentStepId = STEP_ORDER[currentStepIdx];
  const step = getStepById(currentStepId)!;
  const canGoNext = currentStepIdx < STEP_ORDER.length - 1;
  const isLastStep = currentStepIdx === STEP_ORDER.length - 1;

  function updateData(key: keyof OnboardingData, value: any) {
    setData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateStep(): boolean {
    const stepErrors: Partial<Record<keyof OnboardingData, string>> = {};
    step.fields.forEach((field) => {
      const val = data[field.key];
      if (field.required) {
        if (Array.isArray(val)) {
          const min = 'min' in field ? field.min : undefined;
          if (!val.length || (min && val.length < min)) {
            stepErrors[field.key] = 'Required';
          }
        } else if (!val || (typeof val === 'string' && !val.trim())) {
          stepErrors[field.key] = 'Required';
        }
      }
      if (field.key === 'biggestBottleneck' && data.painPoints.length && !data.painPoints.includes(val as string)) {
        stepErrors[field.key] = 'Must be one of your selected pain points';
      }
    });
    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  }

  function handleNext() {
    if (!validateStep()) return;
    if (canGoNext) setCurrentStepIdx((i) => i + 1);
  }

  function handlePrev() {
    setCurrentStepIdx((i) => i - 1);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateStep()) return;
    setSubmitted(true);
    try {
      const res = await authedFetch('/api/onboarding/complete', data);
      if (res.ok) {
        router.push('/app');
      } else {
        setSubmitted(false);
        const errJson = await res.json().catch(() => null);
        alert(errJson?.error || 'Failed to save. Try again.');
      }
    } catch {
      setSubmitted(false);
      alert('Network error. Try again.');
    }
  }

  function handleBackClick() {
    if (currentStepIdx > 0) handlePrev();
  }

  return (
    <div className="onboarding-shell">
      <header className="onboarding-header">
        <Link href="/" className="wordmark" onClick={(e) => { e.preventDefault(); if (confirm('Leave onboarding? Progress will be lost.')) router.push('/'); }}>
          <Logo size={24} />
        </Link>
        <OnboardingProgress currentStep={currentStepId} />
      </header>

      <main className="onboarding-main">
        <StepContent step={step} data={data} updateData={updateData} errors={errors} />
      </main>

      <footer className="onboarding-footer">
        {currentStepIdx > 0 && (
          <button type="button" className="btn btn-ghost" onClick={handlePrev} disabled={submitted}>
            Back
          </button>
        )}
        {isLastStep ? (
          <button type="button" className="btn btn-primary btn-block" onClick={handleSubmit} disabled={submitted}>
            {submitted ? 'Saving...' : 'Finish & Get Roadmap'}
          </button>
        ) : (
          <button type="button" className="btn btn-primary btn-block" onClick={handleNext} disabled={submitted}>
            Continue
          </button>
        )}
      </footer>
    </div>
  );
}