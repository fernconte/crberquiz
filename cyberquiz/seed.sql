insert into public.categories (name, slug)
values
  ('Web Security', 'web-security'),
  ('IoT Security', 'iot-security'),
  ('Hardware Security', 'hardware-security'),
  ('Cryptography', 'cryptography'),
  ('Social Engineering', 'social-engineering')
on conflict do nothing;
