import { CreatePostForm } from "@/components/create-post-form";
import { PageHeader } from "@/components/page-header";
import { getCustomLibraryItemsForPosting } from "@/lib/server-data";

export default async function CreatePostPage() {
  const customLibraryItems = await getCustomLibraryItemsForPosting();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Create Post"
        title="Share to the feed"
        description="Write a caption, add an optional short clip, and publish it straight into the community stream."
      />
      <CreatePostForm customLibraryItems={customLibraryItems} />
    </div>
  );
}
