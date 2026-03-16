import { isValid, parse } from "date-fns";

export const convertDateTime = (dateString: string | undefined) => {
  if (!dateString) return;

  const date = parse(dateString, "yyyy-MM-dd", new Date());

  if (!isValid(date)) {
    throw new Error("Invalid date");
  }

  return date;
};
