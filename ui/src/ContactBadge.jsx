import React from "react";

function ContactBadge() {
  return (
    <div className="fixed bottom-0 right-0 bg-emerald-900 text-white capitalize p-2 pl-4 z-30 rounded-tl-xl">
      For access: Contact {import.meta.env.VITE_CONTACT_NAME}
    </div>
  );
}

export default ContactBadge;
