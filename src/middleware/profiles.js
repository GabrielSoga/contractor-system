const { Op } = require('sequelize');

const getProfile = async (req, res, next) => {
    const { Profile } = req.app.get('models')
    const profile = await Profile.findOne({ where: { id: req.get('profile_id') || 0 } })
    if (!profile) return res.status(401).end()
    req.profile = profile
    next()
}

// SHORTCUT: Ideally, the CLIENT_TYPE keyword should be a Constant declared somewhere in 
// Sequelize ENUM. but we'll take the shortcut and declare it here.
const getClientProfile = async (req, res, next) => {
    const { Profile } = req.app.get('models')
    const CLIENT_TYPE = 'client'
    const profile = await Profile.findOne({
        where: {
            [Op.and]: [
                { id: req.get('profile_id') || 0 },
                { type: CLIENT_TYPE }
            ]
        }
    })
    if (!profile) return res.status(401).end()
    req.profile = profile
    next()
}

module.exports = { getProfile, getClientProfile }
