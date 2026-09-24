import { useState, type ReactNode } from "react";
import { Pencil, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { useLanguage } from "@/i18n/LanguageProvider";
import { cn } from "@/lib/utils";

const copy = {
  en: { edit: "Edit", remove: "Delete", cancel: "Cancel", editTitle: "Edit this item?", editBody: "Do you really want to edit {name}?", removeTitle: "Delete this item?", removeBody: "Do you really want to delete {name}? This cannot be undone.", confirmEdit: "Yes, edit", confirmRemove: "Yes, delete", thisItem: "this item" },
  fr: { edit: "Modifier", remove: "Supprimer", cancel: "Annuler", editTitle: "Modifier cet élément ?", editBody: "Voulez-vous vraiment modifier {name} ?", removeTitle: "Supprimer cet élément ?", removeBody: "Voulez-vous vraiment supprimer {name} ? Cette action est irréversible.", confirmEdit: "Oui, modifier", confirmRemove: "Oui, supprimer", thisItem: "cet élément" },
  es: { edit: "Editar", remove: "Eliminar", cancel: "Cancelar", editTitle: "¿Editar este elemento?", editBody: "¿Seguro que quieres editar {name}?", removeTitle: "¿Eliminar este elemento?", removeBody: "¿Seguro que quieres eliminar {name}? Esta acción no se puede deshacer.", confirmEdit: "Sí, editar", confirmRemove: "Sí, eliminar", thisItem: "este elemento" },
  de: { edit: "Bearbeiten", remove: "Löschen", cancel: "Abbrechen", editTitle: "Dieses Element bearbeiten?", editBody: "Möchtest du {name} wirklich bearbeiten?", removeTitle: "Dieses Element löschen?", removeBody: "Möchtest du {name} wirklich löschen? Dies kann nicht rückgängig gemacht werden.", confirmEdit: "Ja, bearbeiten", confirmRemove: "Ja, löschen", thisItem: "dieses Element" },
  pt: { edit: "Editar", remove: "Excluir", cancel: "Cancelar", editTitle: "Editar este item?", editBody: "Tem certeza de que deseja editar {name}?", removeTitle: "Excluir este item?", removeBody: "Tem certeza de que deseja excluir {name}? Esta ação não pode ser desfeita.", confirmEdit: "Sim, editar", confirmRemove: "Sim, excluir", thisItem: "este item" },
} as const;

export function useActionCopy() {
  const { locale } = useLanguage();
  return copy[locale as keyof typeof copy] ?? copy.en;
}

type Props = {
  onConfirm: () => void | Promise<unknown>;
  /** Name shown in the confirmation text, e.g. "Paris". */
  itemName?: string | undefined;
  /** Override confirmation text (already translated). */
  description?: ReactNode;
  /** Visible label next to the icon; icon-only when omitted. */
  label?: ReactNode;
  disabled?: boolean;
  className?: string;
  size?: "sm" | "icon" | "default";
};

function ConfirmIconButton({ kind, onConfirm, itemName, description, label, disabled, className, size = "icon" }: Props & { kind: "edit" | "remove" }) {
  const c = useActionCopy();
  const [open, setOpen] = useState(false);
  const Icon = kind === "edit" ? Pencil : Trash2;
  const name = itemName ? `« ${itemName} »` : c.thisItem;
  const body = description ?? (kind === "edit" ? c.editBody : c.removeBody).replace("{name}", name);
  const actionLabel = kind === "edit" ? c.edit : c.remove;
  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size={label ? "sm" : size}
        disabled={disabled}
        aria-label={actionLabel}
        title={actionLabel}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={cn(
          label ? "gap-1.5" : "size-8 rounded-full",
          kind === "remove"
            ? "text-destructive hover:bg-destructive/10 hover:text-destructive"
            : "text-primary hover:bg-primary/10 hover:text-primary",
          className,
        )}
      >
        <Icon className="size-4" aria-hidden />
        {label}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <div className={cn("mb-2 grid size-11 place-items-center rounded-full", kind === "remove" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
              <Icon className="size-5" aria-hidden />
            </div>
            <AlertDialogTitle>{kind === "edit" ? c.editTitle : c.removeTitle}</AlertDialogTitle>
            <AlertDialogDescription>{body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{c.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className={cn(kind === "remove" && buttonVariants({ variant: "destructive" }))}
              onClick={() => void onConfirm()}
            >
              {kind === "edit" ? c.confirmEdit : c.confirmRemove}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function EditIconButton(props: Props) {
  return <ConfirmIconButton kind="edit" {...props} />;
}

export function DeleteIconButton(props: Props) {
  return <ConfirmIconButton kind="remove" {...props} />;
}
