type ClassValue = string | false | null | undefined;
type StatefulClassValue<TState = unknown> =
  | ClassValue
  | ((state: TState) => string | undefined);

export function cn(...inputs: ClassValue[]): string;
export function cn<TState>(
  ...inputs: StatefulClassValue<TState>[]
): string | ((state: TState) => string);
export function cn<TState>(...inputs: StatefulClassValue<TState>[]) {
  const hasStatefulClass = inputs.some((input) => typeof input === 'function');

  if (hasStatefulClass) {
    return (state: TState) =>
      inputs
        .map((input) => (typeof input === 'function' ? input(state) : input))
        .filter(Boolean)
        .join(' ');
  }

  return inputs.filter(Boolean).join(' ');
}
