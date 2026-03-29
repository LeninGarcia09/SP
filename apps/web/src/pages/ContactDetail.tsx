import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useContact, useDeleteContact } from '../hooks/use-contacts';
import { usePermissions } from '../hooks/use-permissions';
import { ContactFormDialog } from '../components/contacts/ContactFormDialog';
import { Button } from '../components/ui/button';
import { ArrowLeft, Pencil, Trash2, Mail, Phone, Briefcase, Building2, Linkedin } from 'lucide-react';

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, isLoading, error } = useContact(id!);
  const deleteMut = useDeleteContact();
  const { can } = usePermissions();
  const [editOpen, setEditOpen] = useState(false);

  const contact = data?.data;

  if (isLoading) return <p className="p-6 text-muted-foreground">{t('common.loading')}</p>;
  if (error || !contact) return <p className="p-6 text-destructive">{t('contacts.notFound')}</p>;

  const handleDelete = () => {
    if (!confirm(t('common.delete') + '?')) return;
    deleteMut.mutate(contact.id, { onSuccess: () => navigate('/contacts') });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate('/contacts')}>
          <ArrowLeft className="h-4 w-4 mr-1" /> {t('contacts.backTo')}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground font-mono">{contact.code}</p>
          <h1 className="text-2xl font-bold">{contact.firstName} {contact.lastName}</h1>
          {contact.jobTitle && <p className="text-sm text-muted-foreground">{contact.jobTitle}</p>}
        </div>
        <div className="flex gap-2">
          {can('contacts.update') && (
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" /> {t('common.edit')}
            </Button>
          )}
          {can('contacts.delete') && (
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> {t('common.delete')}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard icon={Mail} label={t('contacts.email')} value={contact.email ?? '—'} />
        <InfoCard icon={Phone} label={t('contacts.phone')} value={contact.phone ?? '—'} />
        <InfoCard icon={Phone} label={t('contactForm.mobilePhoneLabel')} value={contact.mobilePhone ?? '—'} />
        <InfoCard icon={Briefcase} label={t('contacts.jobTitle')} value={contact.jobTitle ?? '—'} />
        <InfoCard icon={Building2} label={t('contacts.department')} value={contact.department ?? '—'} />
        <InfoCard icon={Building2} label={t('contacts.type')} value={contact.type} />
        <InfoCard icon={Building2} label={t('contacts.influence')} value={contact.influence?.replace(/_/g, ' ') ?? '—'} />
        <InfoCard icon={Building2} label={t('contacts.preferredChannel')} value={contact.preferredChannel} />
        {contact.linkedinUrl && (
          <InfoCard icon={Linkedin} label="LinkedIn" value={contact.linkedinUrl} link={contact.linkedinUrl} />
        )}
      </div>

      {contact.notes && (
        <div className="rounded-lg border p-4">
          <h3 className="text-sm font-medium mb-2">{t('contactForm.notesLabel')}</h3>
          <p className="text-sm whitespace-pre-wrap">{contact.notes}</p>
        </div>
      )}

      <ContactFormDialog open={editOpen} onOpenChange={setEditOpen} contact={contact} />
    </div>
  );
}

function InfoCard({ icon: Icon, label, value, link }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; link?: string | null }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:underline">{value}</a>
      ) : (
        <p className="text-sm font-medium">{value}</p>
      )}
    </div>
  );
}
