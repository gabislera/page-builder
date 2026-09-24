import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SlugInput } from "#/components/slug-input";
import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import { Input } from "#/components/ui/input";
import { slugify } from "#/lib/slug";
import { updatePageSettings } from "#/server/pages";

type PageRef = { id: string; name: string; slug: string; status: string };

/** Rename the page and change its URL, from the page list. */
export function PageAddressDialog({
  page,
  projectSlug,
  onClose,
  onSaved,
}: {
  page: PageRef | null;
  projectSlug: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  useEffect(() => {
    if (page) {
      setName(page.name);
      setSlug(page.slug);
    }
  }, [page]);

  const save = useMutation({
    mutationFn: () =>
      updatePageSettings({
        data: {
          pageId: page?.id ?? "",
          name: name.trim(),
          slug: slugify(slug),
        },
      }),
    onSuccess: () => {
      toast.success("Página atualizada");
      onSaved();
      onClose();
    },
    onError: (e) => toast.error(e.message),
  });

  const changedSlug = page && slugify(slug) !== page.slug;

  return (
    <Dialog open={Boolean(page)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nome e endereço</DialogTitle>
          <DialogDescription>
            O nome é só para você se organizar. O endereço é o que aparece no link da página.
          </DialogDescription>
        </DialogHeader>
        <form
          id="page-address"
          className="flex min-w-0 flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim() && slugify(slug)) save.mutate();
          }}
        >
          <div className="flex flex-col gap-1.5">
            <label htmlFor="page-name" className="text-xs text-muted-foreground">
              Nome da página
            </label>
            <Input id="page-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-muted-foreground">Endereço</span>
            <SlugInput prefix={`/p/${projectSlug}/`} value={slug} onChange={setSlug} />
            {changedSlug && page?.status === "published" ? (
              <p className="text-xs leading-relaxed text-amber-500">
                A página publicada passa a responder no endereço novo, e o endereço antigo deixa de funcionar.
              </p>
            ) : null}
          </div>
        </form>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="page-address" disabled={save.isPending || !name.trim() || !slugify(slug)}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
