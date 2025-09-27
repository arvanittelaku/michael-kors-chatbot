import express from 'express';
import { AlbiMallAssistant } from '../services/albiMallAssistant';
import { ChatRequest } from '../types/shared';

const router = express.Router();
const albiMallAssistant = new AlbiMallAssistant();

// Chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a string'
      });
    }

    const request: ChatRequest = {
      message: message.trim(),
      sessionId: sessionId
    };

    const response = await albiMallAssistant.processMessage(request);
    
    res.json(response);

  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get session context
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const context = await albiMallAssistant.getSessionContext(sessionId);
    
    if (!context) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    res.json({
      success: true,
      data: context
    });

  } catch (error) {
    console.error('Session endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Clear session
router.delete('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const success = await albiMallAssistant.clearSession(sessionId);
    
    res.json({
      success: success,
      message: success ? 'Session cleared' : 'Session not found'
    });

  } catch (error) {
    console.error('Clear session endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get active sessions (for debugging)
router.get('/sessions', async (req, res) => {
  try {
    const sessions = await albiMallAssistant.getActiveSessions();
    
    res.json({
      success: true,
      data: {
        activeSessions: sessions,
        count: sessions.length
      }
    });

  } catch (error) {
    console.error('Sessions endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check for Albi Mall service
router.get('/health', async (req, res) => {
  try {
    res.json({
      success: true,
      service: 'Albi Mall Assistant',
      status: 'healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Service unhealthy'
    });
  }
});

export default router;
