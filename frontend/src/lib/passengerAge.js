const toUtcDate = (value) => {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match
    ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    : null;
};

export const calculateAge = (birthDate, today = new Date()) => {
  const birth = toUtcDate(birthDate);
  if (!birth || !Number.isFinite(birth.getTime())) return null;
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const hasNotHadBirthday =
    today.getUTCMonth() < birth.getUTCMonth() ||
    (today.getUTCMonth() === birth.getUTCMonth() && today.getUTCDate() < birth.getUTCDate());
  if (hasNotHadBirthday) age -= 1;
  return age;
};

export const isPassengerAgeValid = (birthDate, passengerType, today = new Date()) => {
  const age = calculateAge(birthDate, today);
  if (age == null || age < 0) return false;
  if (passengerType === "adult") return age >= 18;
  if (passengerType === "child") return age >= 2 && age < 18;
  return age < 2;
};

export const latestAdultBirthDate = (today = new Date()) => {
  const date = new Date(
    Date.UTC(today.getUTCFullYear() - 18, today.getUTCMonth(), today.getUTCDate()),
  );
  return date.toISOString().slice(0, 10);
};
