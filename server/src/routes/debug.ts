import express from 'express';
import { TrieveService } from '../services/chatbot/TrieveService';
import { ParsedFilters } from '../services/chatbot/types';

const router = express.Router();

router.get('/last-search', async (req, res) => {
  const { q } = req.query;
  // For debug, we'll just use the query as a category filter
  const debugFilters: ParsedFilters = { category: String(q || '') };
  const raw = await TrieveService.getProducts(debugFilters); // Use getProducts for raw chunks
  return res.json(raw);
});

export default router;
