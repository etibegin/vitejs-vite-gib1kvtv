import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://jpwjwsaywdwiyladanyi.supabase.co";

const supabasePublishableKey =
  "sb_publishable_zpAbf0InAL9Ju4OgqF_VkA_9kTXfK_J";

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);