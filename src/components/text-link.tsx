export function TextLink({ phone }: { phone: string }) {
  return (
    <a href={`sms:${phone}`} className="text-blue-600 hover:underline">
      Text
    </a>
  );
}
