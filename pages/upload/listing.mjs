// Keep sequencing independently testable: never write a listing before its own image URL exists.
export async function createListing({ image, ...fields }, { uploadImage, saveDocument }) {
  const imageURL = await uploadImage(image);
  if (typeof imageURL !== 'string' || !imageURL) throw new Error('Image upload returned no URL.');
  return saveDocument({ ...fields, imageURL });
}
