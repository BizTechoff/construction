import { remultExpress } from 'remult/remult-express'
import { createPostgresConnection } from 'remult/postgres'
import { User } from '../app/users/user'
import { SignInController, getUser } from '../app/users/SignInController'
import { UpdatePasswordController } from '../app/users/UpdatePasswordController'
import { UsersController } from '../shared/controllers/UsersController'
import { Project } from '../app/projects/project'
import { Message } from '../app/messages/message'
import { Customer } from '../app/customers/customer'
import { Contact } from '../app/customers/contact'
import { ServiceCall } from '../app/service-calls/service-call'
import { WhatsAppMessage } from '../app/whatsapp/whatsapp-message'
import { WhatsAppLog } from '../app/whatsapp/whatsapp-log'
import { ProjectsController } from '../shared/controllers/ProjectsController'
import { CustomersController } from '../shared/controllers/CustomersController'
import { ServiceCallsController } from '../shared/controllers/ServiceCallsController'
import { WhatsAppController } from '../shared/controllers/WhatsAppController'

export const entities = [User, Project, Message, Customer, Contact, ServiceCall, WhatsAppMessage, WhatsAppLog]
export const api = remultExpress({
  admin: true,
  controllers: [
    SignInController,
    UpdatePasswordController,
    UsersController,
    ProjectsController,
    CustomersController,
    ServiceCallsController,
    WhatsAppController
  ],
  entities,
  getUser,
  dataProvider: async () => {
        const STARTING_DONATION_NUM = 1001;
        const provider = await createPostgresConnection({ 
          configuration: "heroku", 
          sslInDev: !(process.env['DEV_MODE'] === 'DEV') })

        /*
                let seq = `
                CREATE SEQUENCE IF NOT EXISTS public.donations_donationnum_seq
                INCREMENT 1
                START 1001
                MINVALUE 1001
                MAXVALUE 2147483647
                CACHE 1
                OWNED BY donations.donationnum;
            `
        
                // findorcreate donationNum serial restart at 1001.
                await provider.execute("alter table donations add column if not exists donationnum serial");
                let result = await provider.execute("SELECT last_value FROM donations_donationnum_seq");
                if (result && result.rows && result.rows.length > 0) {
                    let count = parseInt(result.rows[0].last_value);
                    console.log('donations_donationnum_seq', count)
                    if (count < STARTING_DONATION_NUM) {
                        await provider.execute(`SELECT setval('donations_donationnum_seq'::regclass, ${STARTING_DONATION_NUM}, false)`);
                    }
                }
        */

        return provider
  },
  initApi: async r => {
    // Setup cron job to check reminders every 5 minutes
    // console.log('[Server] Setting up reminder scheduler (every 5 minutes)...')
    // cron.schedule('*/5 * * * *', async () => {
    //   // cron.schedule('*/1 * * * *', async () => {
    //   console.log('[Cron] Running reminder check at:', new Date().toISOString())
    //   await checkAndSendReminders()
    // })

    // // Run once on startup
    // console.log('[Server] Running initial reminder check...')
    // await checkAndSendReminders()
  }

})
